"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { UPLOAD_PROFILE_PICTURE } from "@/services/user_mutations";

const ProfilePictureUpload = () => {
  const [uploadProfilePicture] = useMutation(UPLOAD_PROFILE_PICTURE);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      const { data } = await uploadProfilePicture({ variables: { file } });
      console.log("Upload successful:", data);
      setSuccess(true);
    } catch (error) {
      console.error("Upload failed:", error);
      setSuccess(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {previewUrl && <img src={previewUrl} alt="Preview" className="w-32 h-32 rounded-full object-cover" />}
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Upload
      </button>
      {success && <p className="text-green-600 font-medium">Profile picture updated!</p>}
    </div>
  );
};

export default ProfilePictureUpload;
