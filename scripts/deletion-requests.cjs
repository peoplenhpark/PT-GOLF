/* Read-only GitHub deletion-request preflight. Issue text never executes or edits source. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const REPOSITORY = 'peoplenhpark/PT-GOLF';
const START = '<!-- pt-golf-deletion-request:v1 -->';
const END = '<!-- /pt-golf-deletion-request -->';
function parseRequest(issue) {
  if (!issue || issue.pull_request || issue.state !== 'open' || !Number.isInteger(issue.number) || issue.number < 1) return null;
  const body = typeof issue.body === 'string' ? issue.body.replace(/\r\n/g, '\n') : '';
  if (body.split(START).length !== 2 || body.split(END).length !== 2) return null;
  const start = body.indexOf(START) + START.length;
  const end = body.indexOf(END);
  if (end <= start) return null;
  const block = body.slice(start, end).trim();
  const lines = block.split('\n').map(line=>line.trim()).filter(Boolean);
  if (lines.length !== 2) return null;
  const kind = /^content-kind: (exercise|video)$/.exec(lines[0])?.[1];
  const id = /^content-id: ([A-Za-z0-9_-]+)$/.exec(lines[1])?.[1];
  if (!kind || !id) return null;
  if (kind === 'video' && !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  if (kind === 'exercise' && !/^(pt|ht|golf)_[a-z0-9_]{1,70}$/.test(id)) return null;
  return { issue: issue.number, kind, id, url: 'https://github.com/' + REPOSITORY + '/issues/' + issue.number };
}
function validateApprovals(input) {
  if (!input || !Array.isArray(input.approvals)) throw new Error('deletion-approvals.json must contain an approvals array');
  const seen = new Set();
  for (const item of input.approvals) {
    if (!item || !Number.isInteger(item.issue) || item.issue < 1 || !['exercise','video'].includes(item.kind) ||
        typeof item.id !== 'string' || !item.id || typeof item.approvedAt !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T/.test(item.approvedAt) || !Number.isFinite(Date.parse(item.approvedAt))) {
      throw new Error('Invalid deletion approval; require issue, kind, id and ISO approvedAt');
    }
    if (seen.has(item.issue)) throw new Error('Duplicate deletion approval for issue #' + item.issue);
    seen.add(item.issue);
  }
  return input.approvals;
}
function evaluateRequests(requests, approvals, sourceIds) {
  return requests.map(request => {
    const approved = approvals.some(item => item.issue === request.issue && item.kind === request.kind && item.id === request.id);
    const remains = sourceIds[request.kind].has(request.id);
    return { ...request, approved, remains, blocked: !approved || remains,
      reason: !approved ? '사용자 확인 및 승인 기록 필요' : remains ? '승인된 항목이 원본에 남아 있음' : '원본 제거 확인됨 · 이슈 종료 가능' };
  });
}
async function fetchOpenIssues({ fetchImpl = fetch, token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN } = {}) {
  const issues = [];
  for (let page = 1; page <= 100; page++) {
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'PT-GOLF-deletion-preflight' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const response = await fetchImpl('https://api.github.com/repos/' + REPOSITORY + '/issues?state=open&per_page=100&page=' + page,
      { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('GitHub 삭제 요청 조회 실패 (HTTP ' + response.status + '). 요청 확인 전에는 배포하지 않습니다.');
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('GitHub issues API returned an unexpected response');
    issues.push(...items);
    if (items.length < 100) return issues;
  }
  throw new Error('Too many open issues to verify completely; deployment is blocked');
}
function readSources(root) {
  const read = file => fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/, '');
  const seed = JSON.parse(read('data/seed.json'));
  const context = { window: {} };
  vm.runInNewContext(read('js/golf-data.js'), context, { timeout: 1000 });
  return {
    sourceIds: { exercise: new Set(seed.exercises.map(item=>item.id)), video: new Set(context.window.GolfContent.videos.map(item=>item.id)) },
    approvals: validateApprovals(JSON.parse(read('.github/deletion-approvals.json')))
  };
}
async function main(command = process.argv[2]) {
  if (!['check','list'].includes(command)) {
    console.error('Usage: node scripts/deletion-requests.cjs list|check');
    return 2;
  }
  const { sourceIds, approvals } = readSources(path.resolve(__dirname,'..'));
  const issues = await fetchOpenIssues();
  const requests = issues.map(parseRequest).filter(Boolean);
  const results = evaluateRequests(requests, approvals, sourceIds);
  for (const item of results) console.log('#' + item.issue + ' ' + item.kind + ':' + item.id + ' — ' + item.reason + '\n' + item.url);
  const malformed = issues.filter(issue=>!issue.pull_request && issue.body?.includes(START) && !parseRequest(issue));
  if (malformed.length) console.warn('Ignored malformed request markers in issue(s): ' + malformed.map(issue=>'#'+issue.number).join(', '));
  if (command === 'list') { console.log(results.length + ' open structured deletion request(s).'); return 0; }
  if (results.some(item=>item.blocked)) {
    console.error('DEPLOY BLOCKED: 대상과 범위를 사용자에게 확인한 뒤 승인 기록과 원본 삭제를 함께 반영하세요. 요청 접수만으로 삭제 승인이나 자동 삭제로 간주하지 않습니다.');
    return 1;
  }
  console.log('PASS: ' + results.length + ' open structured deletion request(s); no pending source removal.');
  return 0;
}
module.exports = { START, END, REPOSITORY, parseRequest, validateApprovals, evaluateRequests, fetchOpenIssues, readSources };
if (require.main === module) main().then(code=>{ process.exitCode=code; }).catch(error=>{ console.error(error.message); process.exitCode=1; });
