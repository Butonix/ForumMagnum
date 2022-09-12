import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'

export const PostRelations: PostRelationsCollection = createCollection({
  collectionName: 'PostRelations',
  typeName: 'PostRelation',
  postgres: true,
  schema,
  resolvers: getDefaultResolvers('PostRelations'),
  logChanges: true,
});

addUniversalFields({collection: PostRelations})

export default PostRelations;
