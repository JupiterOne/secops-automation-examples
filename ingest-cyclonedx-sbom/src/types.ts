export interface J1Dependency {
  displayName: string;
  fullName: string;
  name: string;
  version: string;
  license: string;
  direct?: boolean;
  scope?: string;
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
