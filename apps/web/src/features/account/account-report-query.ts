const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function validAccountReportProjectId(value: string): boolean {
  return UUID.test(value);
}

export function accountReportListUpstreamPath(searchParams: URLSearchParams): string | null {
  const keys = [...searchParams.keys()];
  if (keys.some((key) => key !== "project_id")) return null;
  const projectIds = searchParams.getAll("project_id");
  if (projectIds.length === 0) return "/v1/account/reports";
  if (projectIds.length !== 1 || !validAccountReportProjectId(projectIds[0] ?? "")) return null;
  return `/v1/account/reports?project_id=${encodeURIComponent(projectIds[0]!)}`;
}
