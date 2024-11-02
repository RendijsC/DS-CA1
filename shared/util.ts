import { marshall } from "@aws-sdk/util-dynamodb";
import { Game, GameDeveloper } from "./types";

type Entity = Game | GameDeveloper;
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};




