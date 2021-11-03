export interface RepoDependencyMapping {
  repo: string;
  dependencies: string[]
}

export interface RepoDependencyOutput {
  dependencyRepos: string[];
  repoDependencyMappings: RepoDependencyMapping[];
}