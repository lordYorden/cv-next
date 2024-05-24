"use client";
import React, { useState, useEffect } from "react";
import { PencilIcon, Check, X } from "lucide-react";
import { useSupabase } from "@/hooks/supabase";
import { setNewUsername } from "@/app/actions/users/updateUser";

export default function EditableUsername({ user }: { user: UserModel }) {
  const [value, setValue] = useState(user.username || user.full_name || "");
  const [tempValue, setTempValue] = useState(
    user.username || user.full_name || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [viewingCurrentUser, setViewingCurrentUser] = useState(false);
  const [errorUpdating, setError] = useState("");
  const supabase = useSupabase();

  useEffect(() => {
    async function getUser() {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("User not found");
      if (userId === user.id) {
        setViewingCurrentUser(true);
      }
    }
    getUser();
  }, [supabase.auth, user.id]);

  useEffect(() => {
    (async () => {
      if (value != (user.username || user.full_name) && viewingCurrentUser) {
        const result = await setNewUsername(user.id, value);
        if (!result.ok) {
          if (result.postgrestError?.message.includes("duplicate key value")) {
            setError("Name unavailable!");
          } else {
            setError("Error updating the username!");
          }
        }
      }
    })();
  }, [value, user, viewingCurrentUser]);

  function handleStartEditing() {
    setIsEditing(true);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTempValue(event.target.value);
  }

  function handleCancel() {
    setIsEditing(false);
    setTempValue(value);
  }

  const handleSave = async () => {
    setIsEditing(false);
    setValue(tempValue);
  };

  if (!viewingCurrentUser) {
    return (
      <div className="flex items-center">
        <p className="inline-flex items-center text-xl font-semibold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-3 flex items-center justify-center">
      {isEditing ? (
        <div className="flex items-center">
          <input
            type="text"
            value={tempValue}
            onChange={handleChange}
            autoFocus
            className="mr-2 rounded-md border border-gray-300 p-2 text-xl font-semibold text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSave}
            className="text-xl text-gray-600 dark:text-gray-300"
          >
            <Check />
          </button>
          <button
            onClick={handleCancel}
            className="text-xl text-gray-600 dark:text-gray-300"
          >
            <X />
          </button>
        </div>
      ) : (
        <div className="flex items-center">
          <p className="inline-flex items-center text-xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          <button
            onClick={handleStartEditing}
            className="ml-2 text-gray-600 dark:text-gray-300"
          >
            <PencilIcon size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
