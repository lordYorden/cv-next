"use server"

import { notFound } from "next/navigation"
import { getCvById } from "@/server/api/cvs"
import { decodeValue } from "@/lib/utils"
import { CvPreview } from "./components/cvPreview"
import CommentsSection from "./components/commentSection/commentsSection"

export default async function Page({ params }: { params: { cvId: string } }) {
  const { cvId } = params

  const decodedCvId = decodeValue(decodeURIComponent(cvId))
  if (!decodedCvId) {
    notFound()
  }
  const cv = await getCvById(decodedCvId)

  if (cv === null) {
    notFound()
  }

  return (
    <div className="grid grid-cols-1 gap-y-4 md:grid-cols-[65%_35%] md:gap-x-4">
      <section className="h-[78.75rem] flex-col rounded-lg">
        {cv ? <CvPreview cv={cv} /> : null}
      </section>
      <section className="h-[78.75rem] flex-col self-start">
        <CommentsSection cv={cv} />
      </section>
    </div>
  )
}
