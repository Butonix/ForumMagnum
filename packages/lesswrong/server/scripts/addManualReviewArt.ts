import { createAdminContext } from "../vulcan-lib/createContexts";
import { moveImageToCloudinary } from "./convertImagesToCloudinary";
import { createReviewWinnerArt } from "../collections/reviewWinnerArts/mutations";

const reviewWinnerArtManualAdditions: ({id: string, prompt: string, url: string})[] = [{
  id: 'vLRxmYCKpmZAAJ3KC',
  prompt: "an elephant that's friends with a seal",
  url: "https://cdn.discordapp.com/attachments/1204502718140649523/1207535719170441246/lwbot_topographic_watercolor_artwork_of_an_elephant_thats_frien_1995ab9d-e775-44ed-adb2-3a8287018169.png?ex=65e00046&is=65cd8b46&hm=5bd63109921ce0334548efa50a9f8083664b851c8417fee1537e6487b8ebc76f&"
}]

// Exported to allow running manually with "yarn repl"
export const manuallyAddReviewWinnerArt = async () => {
  for (let { prompt, url, id } of reviewWinnerArtManualAdditions) {
    const cloudinaryUrl = await moveImageToCloudinary({oldUrl: url, originDocumentId: prompt});
    if (cloudinaryUrl === null) {
      // eslint-disable-next-line no-console
      console.error(`Failed to upload image to cloudinary for prompt: ${prompt}`);
      continue;
    }

    await createReviewWinnerArt({
      data: {
        postId: id,
        splashArtImagePrompt: prompt,
        splashArtImageUrl: cloudinaryUrl
      }
    }, createAdminContext()).catch((error) => {
      // eslint-disable-next-line no-console
      console.dir(error, { depth: null })
      throw error
    });
  }
}

