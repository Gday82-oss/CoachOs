export interface PullRequest {
  number: number;
  title: string;
  user: {
    login: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  changed_files: number;
  additions: number;
  deletions: number;
}

export interface PullRequestFile {
  filename: string;
  status: string;
  changes: number;
  patch?: string;
}
