export interface J1Dependency {
  displayName: string;
  fullName: string;
  name: string;
  version: string;
  license: string;
  purl?: string;
  direct?: boolean;
  scope?: string;
  from?: string;
}

export interface J1UsesRelationship {
  displayName: string;
  version: string;
  devDependency?: boolean;
  directDependency?: boolean;
}

export interface SBOM {
    bomFormat: string;
    specVersion: string;
    version: number;
    metadata: SBOMMeta;
    components: SBOMComponent[];
  }
  
  type SBOMMeta = {
    tools: {
      vendor: string;
      name: string;
      version: string;
    }[];
  };
  
  type ExternalReference = {
    type: string;
    url: string;
  };
  
  export interface SBOMComponent {
    type: string;
    'bom-ref': string;
    name: string;
    version: string;
    description: string;
    licenses: License[];
    purl: string;
    externalReferences: ExternalReference[];
    group?: string;
  }

  export type License = {
    license: {
      id: string;
    };
  };
