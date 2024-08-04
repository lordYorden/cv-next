"use client";

import { deleteComment } from "@/app/actions/comments/deleteComment";
import { setResolved } from "@/app/actions/comments/setResolved";
import { upvoteComment } from "@/app/actions/comments/setLike";
import { addComment } from "@/app/actions/comments/addComment";
import { useSWRConfig } from "swr";
import { RxPlus } from "react-icons/rx";
import { GoCheckCircle } from "react-icons/go";
import { GoCheckCircleFill } from "react-icons/go";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaComment } from "react-icons/fa";
import Tooltip from "../../../../../components/ui/tooltip";
import { AiTwotoneLike } from "react-icons/ai";
import { AiFillLike } from "react-icons/ai";
import { useState } from "react";
import Alert from "../../../../../components/ui/alert";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabase } from "@/hooks/supabase";

const NewCommentBlock = ({
  commentOnCommentStatus,
  setCommentOnComment,
  addNewCommentClickEvent,
}: any) => {
  return commentOnCommentStatus ? (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <input
        type="text"
        onChange={(e) => setCommentOnComment(e.target.value)}
        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        required
      />
      <RxPlus
        style={{ fontSize: "5vh" }}
        onClick={async () => {
          await addNewCommentClickEvent();
        }}
      />
    </div>
  ) : null;
};

const VotingSection = ({ userVoted, setLikedCommentAction }: any) => {
  return userVoted ? (
    <button>
      <AiFillLike
        onClick={() => setLikedCommentAction(false)}
        size="1.4rem"
        style={{
          transform: "translateY(2px)",
        }}
      />
    </button>
  ) : (
    <button>
      <AiTwotoneLike
        size="1.4rem"
        color="grey"
        style={{
          transform: "translateY(2px)",
        }}
        onClick={() => setLikedCommentAction(true)}
      />
    </button>
  );
};

const ResolvedSection = ({ userResolved, setResolvedCommentAction }: any) => {
  return userResolved ? (
    <button
      className="text-green-500"
      onClick={() => setResolvedCommentAction(false)}
    >
      <GoCheckCircleFill
        style={{
          transform: "translateY(2px)",
        }}
        fontSize="1.4rem"
      />
    </button>
  ) : (
    <button
      className="text-green-500"
      onClick={() => setResolvedCommentAction(true)}
    >
      <GoCheckCircle
        style={{
          transform: "translateY(2px)",
        }}
        fontSize="1.4rem"
      />
    </button>
  );
};

const CommenterActions = ({
  commenter,
  userId,
  setShowAlert,
  resolvedSection,
}: any) => {
  return commenter.id === userId ? (
    <>
      <span>
        <>
          <button className="text-red-500" onClick={() => setShowAlert(true)}>
            <FaRegTrashCan
              data-tooltip-target="Trash Icon"
              style={{
                transform: "translateY(2px)",
              }}
              fontSize="1.4rem"
            />
          </button>
          <Tooltip id="Trash icon" message="delete"></Tooltip>
          <span> </span>
        </>
      </span>
      <span> </span>
      {resolvedSection}
    </>
  ) : null;
};

const GeneralActions = ({ startNewComment, votingSection, comment }: any) => {
  return (
    <>
      <span>{startNewComment}</span>
      <span>
        {votingSection} {comment.upvotes?.length || null}
      </span>
    </>
  );
};

const AlertComponent = ({ showAlert, onAlertClick }: any) => {
  return showAlert ? (
    <Alert
      display={showAlert ? "flex" : "none"}
      message="You sure you want to delete this comment?"
      color="red"
      onClick={onAlertClick}
    ></Alert>
  ) : null;
};

const StartNewComment = ({
  commentOnCommentStatus,
  setCommentOnCommentStatus,
}: any) => {
  return !commentOnCommentStatus ? (
    <button className="text-green-500">
      <FaComment
        size="1.2rem"
        style={{
          marginRight: "0.4rem",
          transform: "translateY(2px)",
        }}
        onClick={() => setCommentOnCommentStatus(!commentOnCommentStatus)}
      />
    </button>
  ) : null;
};

interface CommentProps {
  comment: CommentModel;
  userId: string;
  childDepth?: number;
  commentsOfComment: CommentModel[];
  setCommentsOfComments: (
    update: (prev: Map<string, any[]>) => Map<string, any[]>
  ) => void;
}

export default function Comment({
  comment,
  userId,
  childDepth = 0,
  commentsOfComment = [],
  setCommentsOfComments,
}: CommentProps) {
  const supabase = useSupabase();
  const [commentOnCommentStatus, setCommentOnCommentStatus] =
    useState<boolean>(false);
  const [commentOnComment, setCommentOnComment] = useState<string>("");
  const router = useRouter();
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const onAlertClick = async (type: boolean) => {
    if (type) await deleteCommentAction();
    setShowAlert(false);
  };
  const { mutate } = useSWRConfig();

  const addNewCommentClickEvent = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      router.push("/inactive");
      return;
    }

    const commentToAdd: NewCommentModel = {
      data: commentOnComment,
      document_id: comment.document_id,
      parent_comment_Id: comment.id,
      user_id: userId,
    };

    const optimisticData = (
      prevData: CommentModel[] | undefined
    ): CommentModel[] => {
      const newCommentsOfComments = new Map<string, CommentModel[]>(
        prevData?.reduce((acc, cur) => {
          const key = cur.parent_comment_Id || "root"; // Use 'root' for top-level comments
          if (!acc.has(key)) {
            acc.set(key, []);
          }
          acc.get(key)!.push(cur);
          return acc;
        }, new Map<string, CommentModel[]>()) || []
      );

      const parentId = comment.id;
      if (!newCommentsOfComments.has(parentId)) {
        newCommentsOfComments.set(parentId, []);
      }
      newCommentsOfComments
        .get(parentId)!
        .push(commentToAdd as unknown as CommentModel);

      return Array.from(newCommentsOfComments.values()).flat();
    };

    try {
      mutate(comment.document_id, optimisticData, {
        optimisticData: optimisticData(commentsOfComment),
        rollbackOnError: (error) => {
          // Type-checking for error
          if (error instanceof Error) {
            return error.name !== "AbortError";
          }
          // Rollback if error is not an instance of Error
          return true;
        },
      });
      await addComment(commentToAdd);
      mutate(comment.document_id);
    } catch (error) {
      mutate(comment.document_id);
    }
  };

  const date = new Date(
    comment.last_update ? comment.last_update : new Date().getTime()
  );
  const childOrParentStyling = childDepth
    ? `p-3 ml-${6 / childDepth} lg:ml-${12 / childDepth} border-t border-gray-400 dark:border-gray-600`
    : "p-6 mb-3 border-b border-gray-200 rounded-lg";

  const deleteCommentAction = async () => {
    await deleteComment(comment.id).finally(() => {
      setCommentsOfComments((prev: Map<string, any[]>) => {
        const newCommentsOfComments = new Map<string, any[]>(prev);
        newCommentsOfComments.delete(comment.id);
        return newCommentsOfComments;
      });
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

  const commenter = JSON.parse(JSON.stringify(comment.user_id));

  const userVoted = comment.upvotes?.includes(userId);
  const userResolved = comment.resolved;

  const commentBackground = userResolved
    ? "bg-green-200 dark:bg-green-800"
    : "bg-white dark:bg-theme-800";

  return (
    <article
      key={comment.id}
      className={`${commentBackground} text-base ${childOrParentStyling}`}
    >
      <footer className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <p className="mr-3 inline-flex items-center text-sm font-semibold text-gray-900 dark:text-white">
            <Link
              className="text-lg font-medium hover:underline"
              href={`/profile/${commenter.id}`}
            >
              {commenter.username || commenter.full_name}
            </Link>
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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ display: "flex", width: "100%" }}>
          <div>
            <GeneralActions
              startNewComment={
                <StartNewComment
                  commentOnCommentStatus={commentOnCommentStatus}
                  setCommentOnCommentStatus={setCommentOnCommentStatus}
                />
              }
              votingSection={
                <VotingSection
                  userVoted={userVoted}
                  setLikedCommentAction={setLikedCommentAction}
                />
              }
              comment={comment}
            />
          </div>
          <div style={{ marginLeft: "auto" }}>
            <CommenterActions
              commenter={commenter}
              userId={userId}
              setShowAlert={setShowAlert}
              resolvedSection={
                <ResolvedSection
                  userResolved={userResolved}
                  setResolvedCommentAction={setResolvedCommentAction}
                />
              }
            />
          </div>
        </span>
      </div>
      <AlertComponent showAlert={showAlert} onAlertClick={onAlertClick} />
      <NewCommentBlock
        commentOnCommentStatus={commentOnCommentStatus}
        setCommentOnComment={setCommentOnComment}
        addNewCommentClickEvent={addNewCommentClickEvent}
      />
      {commentsOfComment?.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          userId={userId}
          childDepth={1}
          commentsOfComment={[]}
          setCommentsOfComments={setCommentsOfComments}
        />
      ))}
    </article>
  );
}
