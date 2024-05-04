"use client";
import { deleteComment } from "@/app/actions/comments/deleteComment";
import { setResolved } from "@/app/actions/comments/setResolved";
import { upvoteComment } from "@/app/actions/comments/setLike";
import { getUser } from "@/app/actions/users/getUser";
import useSWR, { mutate } from "swr";

export default function Comment({
  comment,
  userId,
  childDepth = 0,
  setCommentsOfCommentsEdit,
  CommentsOnCommentsEdit,
  setCommentStatus,
  isOnEdit = false,
  commentStatus,
}: {
  comment: CommentModel;
  userId: string;
  childDepth?: number;
  isOnEdit?: boolean;
  CommentsOnCommentsEdit: Map<string, boolean>;
  commentStatus: boolean;
  setCommentStatus: (value: boolean) => void;
  setCommentsOfCommentsEdit: (value: Map<string, boolean>) => void;
}) {
  const date = new Date(comment.last_update);
  const childOrParentStyling = childDepth
    ? `p-3 ml-${6 / childDepth} lg:ml-${12 / childDepth} border-t border-gray-400 dark:border-gray-600`
    : "p-6 mb-3 border-b border-gray-200 rounded-lg";

  const deleteCommentAction = async () => {
    await deleteComment(comment.id).finally(() => {
      mutate(comment.document_id);
    });
  };

  const setResolvedCommentAction = async (resolved: boolean) => {
    await setResolved(comment.id, resolved).finally(() => {
      mutate(comment.document_id);
    });
  };

  const setLikedCommentAction = async (liked: boolean) => {
    await upvoteComment(comment.id, liked, userId).finally(() => {
      mutate(comment.document_id);
    });
  };

  const commentOnComment = async (toComment: boolean) => {
    console.log(CommentsOnCommentsEdit);
    let repOfCommentsOnCommentsEdit = CommentsOnCommentsEdit;
    setCommentsOfCommentsEdit(
      repOfCommentsOnCommentsEdit.set(
        comment.id,
        !repOfCommentsOnCommentsEdit.get(comment.id)
      )
    );
    setCommentStatus(!commentStatus);
  };

  const { data: user } = useSWR(comment.user_id, getUser);
  if (user && user.ok) {
    const userName =
      user.val.username && user.val.username.length > 0
        ? user.val.username
        : user.val.full_name;

    return (
      <article
        key={comment.id}
        className={`bg-white text-base dark:bg-theme-800 ${childOrParentStyling}`}
      >
        <footer className="mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <p className="mr-3 inline-flex items-center text-sm font-semibold text-gray-900 dark:text-white">
              {userName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <time
                dateTime={date.toLocaleString()}
                title={date.toLocaleString()}
              >
                {date.toLocaleString()}
              </time>
            </p>
          </div>
        </footer>
        <p className="text-gray-500 dark:text-gray-400">{comment.data}</p>
        {comment.user_id === userId ? (
          <>
            <button className="text-red-500" onClick={deleteCommentAction}>
              Delete
            </button>
            <span> </span>
            {comment.resolved === true ? (
              // TODO: change appearence of comment based on if its resolved or not
              <button
                className="text-green-500"
                onClick={() => setResolvedCommentAction(false)}
              >
                UnResolve
              </button>
            ) : (
              <button
                className="text-gray-500"
                onClick={() => setResolvedCommentAction(true)}
              >
                Resolve
              </button>
            )}
          </>
        ) : (
          <button
            className="text-green-500"
            onClick={() => commentOnComment(true)}
          >
            Comment
          </button>
        )}
        <span> </span>
        {comment.upvotes && comment.upvotes.includes(userId) ? (
          <button
            className="text-gray-500"
            onClick={() => setLikedCommentAction(false)}
          >
            UnLike {comment.upvotes?.length || 0}
          </button>
        ) : (
          <button
            className="text-gray-500"
            onClick={() => setLikedCommentAction(true)}
          >
            Like {comment.upvotes?.length || 0}
          </button>
        )}
        {CommentsOnCommentsEdit.get(comment.id) ? (
          <p className="underline underline-offset-4">edit param</p>
        ) : null}
      </article>
    );
  } else {
    // TODO: Show error
    return null;
  }
}
