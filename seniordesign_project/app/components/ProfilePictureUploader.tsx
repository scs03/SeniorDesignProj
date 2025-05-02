"use client";
import React, { useState, useRef, useEffect } from "react";

const ProfilePictureUploader = () => {
  const [previewUrl, setPreviewUrl] = useState("/placeholder-profile.jpg");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 🔁 Fetch current user's profile picture on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8000/graphql", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query {
                curr_user_info {
                  profile_picture
                }
              }
            `,
          }),
        });

        const result = await res.json();
        const picUrl = result?.data?.curr_user_info?.profile_picture;
        if (picUrl) {
          setPreviewUrl(picUrl);
        }
      } catch (error) {
        console.error("Failed to fetch profile picture:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    const formData = new FormData();
    formData.append(
      "operations",
      JSON.stringify({
        query: `
          mutation UploadProfilePic($picture: Upload!) {
            uploadProfilePicture(picture: $picture) {
              profile_picture
            }
          }
        `,
        variables: {
          picture: null,
        },
      })
    );
    formData.append("map", JSON.stringify({ "0": ["variables.picture"] }));
    formData.append("0", file);

    try {
      const res = await fetch("http://localhost:8000/graphql", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await res.json();
      const uploadedUrl = result?.data?.uploadProfilePicture?.profile_picture;
      if (uploadedUrl) {
        setPreviewUrl(uploadedUrl);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <label htmlFor="profile-upload" className="cursor-pointer group relative">
        <img
          src={previewUrl}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover border-2 border-blue-300 hover:ring-2 hover:ring-blue-400 transition"
        />
        <input
          id="profile-upload"
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
          Change
        </span>
      </label>
    </div>
  );
};

export default ProfilePictureUploader;
