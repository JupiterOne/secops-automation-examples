export interface BuildPayloadInput {
  sourceId: string;
  sourceKey: string;
  sourceType: string;
  sourceClass: string;
  sinkId: string;
  sinkKey: string;
  sinkType: string;
  sinkClass: string;
}

export interface BulkUploadOutput {
  _key: string;
  _type: string;
  _class: string;
  _fromEntityId: string;
  _toEntityId: string;
  [key: string]: string | boolean;
}

export const buildPayload = <T extends BuildPayloadInput>({
  data,
  verbCb,
  relationshipPropsCb,
}: {
  data: T[];
  verbCb: (input: T) => string;
  relationshipPropsCb: (input: T) => Record<string, string>;
}): BulkUploadOutput[] => {
  return data.map(input => {
    const {
      sourceId,
      sourceKey,
      sourceType,
      sinkId,
      sinkKey,
      sinkType,
    } = input;
    const relVerb = verbCb(input);
    const relationshipKey =
      sourceKey + "|" + relVerb.toLowerCase() + "|" + sinkKey;
    const relationshipType =
      sourceType + "_" + relVerb.toLowerCase() + "_" + sinkType;

    const payload = {
      _key: relationshipKey,
      _type: relationshipType,
      _class: relVerb,
      _fromEntityId: sourceId,
      _toEntityId: sinkId,
      pseudoRelationship: true,
      hackathon2021: true,
      ...relationshipPropsCb(input),
    };
    return payload;
  });
};
