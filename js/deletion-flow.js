/* Cross-device deletion request hand-off for this static GitHub Pages app. */
window.DeletionFlow = (() => {
  const REPOSITORY = 'peoplenhpark/PT-GOLF';
  const MARKER = 'pt-golf-deletion-request:v1';
  const END_MARKER = 'pt-golf-deletion-request';
  const validKind = kind => kind === 'exercise' || kind === 'video';

  function assertRequest(request) {
    if (!request || !validKind(request.kind) || !/^[A-Za-z0-9_-]+$/.test(request.contentId || '') || !request.title) {
      throw new Error('삭제 요청 정보를 확인할 수 없습니다.');
    }
    return request;
  }

  function issueTitle(request) {
    const item = assertRequest(request);
    const label = item.kind === 'video' ? '영상' : '동작';
    return `[PT-GOLF 삭제 요청] ${label}: ${item.title} (${item.contentId})`;
  }

  function issueBody(request) {
    const item = assertRequest(request);
    return [
      `<!-- ${MARKER} -->`,
      `content-kind: ${item.kind}`,
      `content-id: ${item.contentId}`,
      `<!-- /${END_MARKER} -->`,
      '',
      `항목명: ${item.title}`,
      `요청 시각: ${item.requestedAt || new Date().toISOString()}`,
      '',
      '이 요청은 현재 기기에서 항목을 숨깁니다.',
      '다음 배포 전에 항목명과 ID를 다시 확인하고 승인한 뒤 원본에서 삭제합니다.',
      '개인 메모나 레슨 내용은 이 요청 본문에 포함하지 않습니다.'
    ].join('\n');
  }

  function issueUrl(request) {
    const params = new URLSearchParams({
      template: 'content-removal.md',
      title: issueTitle(request),
      body: issueBody(request),
      labels: 'deletion-request'
    });
    return `https://github.com/${REPOSITORY}/issues/new?${params}`;
  }

  function openIssue(request) {
    const url = issueUrl(request);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      // Browsers may return null for a successfully opened noopener tab, so the
      // return value can only describe the navigation attempt, not popup state.
      return { url, attempted: true };
    } catch {
      return { url, attempted: false };
    }
  }

  function issueSearchUrl(request) {
    const item = assertRequest(request);
    const query = `repo:${REPOSITORY} is:issue ${item.kind} ${item.contentId}`;
    return `https://github.com/${REPOSITORY}/issues?q=${encodeURIComponent(query)}`;
  }

  return { REPOSITORY, MARKER, END_MARKER, issueTitle, issueBody, issueUrl, issueSearchUrl, openIssue };
})();
