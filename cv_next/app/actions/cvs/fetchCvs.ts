"use server";

import { getCvById } from "@/server/api/cvs";

export const getCvsFromComments = async (
  comments: CommentModel[]
): Promise<CvModel[]> => {
  const uniqueDocuments: Set<CvModel> = new Set(); // Use a Set to store unique documents

  // Iterate through the comments
  for (const comment of comments) {
    const document_id: string = comment.document_id;
    if (document_id !== undefined) {
      // Use the placeholder function to get the document by its ID
      const document = await getCvById(document_id);
      if (document) {
        uniqueDocuments.add(document); // Add the document to the Set
      }
    }
  }

  return Array.from(uniqueDocuments); // Convert Set to array and return
};
