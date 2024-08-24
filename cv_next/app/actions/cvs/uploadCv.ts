"use server";
import { transformToPreviewLink } from "@/lib/utils";
import { uploadCV, getCvsByUserId } from "@/server/api/cvs";
import { transformGoogleViewOnlyUrl } from "@/helpers/cvLinkRegexHelper";
import { redirect } from "next/navigation";
import logger from "@/server/base/logger";

export interface InputValues {
  link: string;
  description: string;
  catagoryId: number[] | null;
}

export const checkUploadCV = async ({
  cvData,
  userId, // TODO: Switch to getting uid from server
}: {
  cvData: InputValues;
  userId: string;
}): Promise<string | null> => {
  if (
    !cvData.link?.trim() ||
    !cvData.description?.trim() ||
    cvData.catagoryId === undefined
  ) {
    logger.error("Missing variables!");
    return "Missing variables!";
  }

  if (!(await canUserUploadACV(userId))) {
    logger.error("The user has at least 5 CVs already");
    return "The user has at least 5 CVs already";
  }

  const transformedURL = transformGoogleViewOnlyUrl(cvData.link);

  if (transformedURL == "") {
    logger.error("Couldn't transform the link", cvData.link);
    return "Regex invalid!";
  }

  const res = await fetch(transformToPreviewLink(transformedURL), {
    method: "HEAD",
  });

  if (res.status !== 200) {
    logger.error("Couldn't Find The CV", cvData.link);
    return "Invalid URL for CV";
  }

  const cookieHeader = res.headers.get("set-cookie");
  if (!cookieHeader || !cookieHeader.includes("COMPASS")) {
    logger.error("COMPASS cookie not found", cvData.link);
    return "CV File is Private";
  }

  const cvToUpload: NewCvModel = {
    document_link: transformedURL,
    description: cvData.description,
    category_id: (cvData.catagoryId ?? [0])[0],
    user_id: userId,
    cv_categories: cvData.catagoryId ?? [],
  };

  logger.debug("Can upload:", cvToUpload);

  const response = await uploadCV(cvToUpload);
  if (response) {
    logger.debug("Uploaded");
    redirect(`/cv/${response.id}`);
  } else {
    return "Error uploading";
  }

  return null;
};

export const canUserUploadACV = async (userId: string) => {
  const cvsOfUser = await getCvsByUserId(userId);
  return !cvsOfUser || cvsOfUser.length < 5;
};
