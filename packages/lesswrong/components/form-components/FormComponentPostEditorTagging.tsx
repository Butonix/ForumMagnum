import React from 'react';
import { useHover } from '../common/withHover';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import toDictionary from '../../lib/utils/toDictionary';
import mapValues from 'lodash/mapValues';
import { taggingNamePluralSetting } from '../../lib/instanceSettings';

/**
 * Edit tags on the new or edit post form. If it's the new form, use
 * TagMultiSelect; a server-side callback will convert tags to tag-relevances.
 * If it's the edit form, instead use FooterTagList, which has the same
 * voting-on-tag-relevance as the post page. Styling doesn't match between these
 * two, which is moderately unfortunate.
 */
const FormComponentPostEditorTagging = ({value, path, document, label, placeholder, formType, updateCurrentValues}: {
  value: any,
  path: string,
  document: any,
  label?: string,
  placeholder?: string,
  formType: "edit"|"new",
  updateCurrentValues: any,
}) => {
  if (formType === "edit") {
    return <Components.FooterTagList
      post={document}
      hideScore
    />
  } else {
    return <Components.TagMultiselect
      path={path} label={label}
      placeholder={`Add ${taggingNamePluralSetting.get()}`}
      
      value={Object.keys(value||{})}
      updateCurrentValues={(changes) => {
        updateCurrentValues(
          mapValues(
            changes,
            (arrayOfTagIds: string[]) => toDictionary(
              arrayOfTagIds, tagId=>tagId, tagId=>1
            )
          )
        )
      }}
    />
  }
}

const FormComponentPostEditorTaggingComponent = registerComponent("FormComponentPostEditorTagging", FormComponentPostEditorTagging);

declare global {
  interface ComponentTypes {
    FormComponentPostEditorTagging: typeof FormComponentPostEditorTaggingComponent
  }
}


