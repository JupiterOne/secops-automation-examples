export interface BuildPayloadInput {
    sourceId: string
    sourceKey: string
    sourceType: string
    sourceClass: string
    sourceName: string
    sinkId: string
    sinkKey: string
    sinkType: string
    sinkClass: string
    sinkName: string

}

export interface BulkUploadOutput {
    _key: string
    _type: string
    _class: string
    _fromEntityId: string
    _toEntityId: string
}

export const buildPayload = ({data, verbCb}:
    { data: BuildPayloadInput[],
    verbCb: () => string}
  ): BulkUploadOutput[] => {

    return data.map((input) => {
        const {
            sourceId,
            sourceKey,
            sourceType,
            sourceClass,
            sourceName,
            sinkId,
            sinkKey,
            sinkType,
            sinkClass,
            sinkName,
          } = input;
          const relVerb = [sinkClass].flat().includes("Database")
            ? "ACCESSES"
            : "EXECUTES";
          const relationshipKey =
            sourceKey + "|" + relVerb.toLowerCase() + "|" + sinkKey;
          const relationshipType =
            sourceType + "_" + relVerb.toLowerCase() + "_" + sinkType;
          const payload2 = {
            _key: relationshipKey,
            _type: relationshipType,
            _class: relVerb,
            _fromEntityId: sourceId,
            _toEntityId: sinkId,
            properties: {
                pseudoRelationship: true,
                hackathon2021: true,
            },
          }
          return payload2
    });   
  };