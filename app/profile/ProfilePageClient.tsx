"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { IoSettings } from "react-icons/io5";
import TodoList from "./components/todo";
import UserFlashcardCarousel, { type Flashcard } from "./components/flashCards";

type ProfilePageClientProps = {
  initialEmail: string;
  initialFullName: string;
  initialPhone: string;
  initialAddress: string;
  initialAvatarUrl: string | null;
  memberSince: string | null;
  initialFlashcards: Flashcard[];
};

export default function ProfilePageClient({
  initialEmail,
  initialFullName,
  initialPhone,
  initialAddress,
  initialAvatarUrl,
  memberSince,
  initialFlashcards,
}: ProfilePageClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  async function handleSave() {
    setIsSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) {
      setIsSaving(false);
      return;
    }

    await supabase.auth.updateUser({
      email,
      data: {
        display_name: fullName,
      },
    });

    let nextAvatarUrl = avatarUrl;

    if (removeAvatar) {
      const filePathPng = `${user.id}/avatar.png`;
      const filePathJpg = `${user.id}/avatar.jpg`;

      await supabase.storage.from("avatars").remove([filePathPng, filePathJpg]);
      nextAvatarUrl = null;
    }

    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

      if (!allowedTypes.includes(file.type)) {
        alert("Only PNG, JPG, and JPEG images are allowed.");
        setIsSaving(false);
        return;
      }

      const extension = file.type === "image/png" ? "png" : "jpg";
      const filePath = `${user.id}/avatar.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Upload failed:", uploadError);
        setIsSaving(false);
        return;
      }

      const { data: signedData } = await supabase.storage
        .from("avatars")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      nextAvatarUrl = signedData?.signedUrl || null;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      phone,
      address,
      avatar_url: nextAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Profile update failed:", profileError);
      alert("Profile update failed. Check console for details.");
      setIsSaving(false);
      return;
    }

    setAvatarUrl(nextAvatarUrl);
    setIsEditing(false);
    setIsSaving(false);
    setFile(null);
    setRemoveAvatar(false);
  }

  return (
    <main className="min-h-screen bg-neutral-100 flex justify-center items-start md:items-center px-3 sm:px-4 py-6 sm:py-8 pt-20 sm:pt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-6xl">
        <div className="shadow-xl flex flex-col px-5 py-6 sm:px-6 md:px-8 col-span-1 w-full gap-4 items-center justify-center bg-linear-to-r from-purple-200 to-pink-200 via-white rounded-2xl text-center">
          <span className="text-6xl">👋</span>
          <div className="flex flex-col gap-2 items-center justify-center">
            <h1 className="text-2xl font-light">Welcome Back, {fullName}</h1>
            <span className="font-light text-sm">
              Ready For the practice today
            </span>
          </div>
          <Link
            href="/mock-tests"
            className="text-white bg-black rounded-xl px-5 sm:px-6 py-3 sm:py-4 font-light leading-relaxed w-full sm:w-auto"
          >
            Start Practicing
          </Link>
        </div>

        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl shadow-xl w-full col-span-1 md:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-light">My Profile</h2>
            <button onClick={() => setIsEditing(true)} className="text-2xl">
              <IoSettings className="text-neutral-500" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  fill
                  sizes="112px"
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-300 flex items-center justify-center">
                  Add something
                </div>
              )}

              {isEditing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition">
                  <label className="text-white text-xs cursor-pointer mb-1">
                    Change
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] || null;
                        if (!selected) return;

                        const allowedTypes = [
                          "image/png",
                          "image/jpeg",
                          "image/jpg",
                        ];
                        if (!allowedTypes.includes(selected.type)) {
                          alert("Only PNG, JPG, and JPEG images are allowed.");
                          return;
                        }

                        setFile(selected);
                        setRemoveAvatar(false);
                        setAvatarUrl(URL.createObjectURL(selected));
                      }}
                    />
                  </label>

                  <button
                    onClick={() => {
                      setFile(null);
                      setRemoveAvatar(true);
                      setAvatarUrl(null);
                    }}
                    className="text-white text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-sm text-neutral-500">Learning since</p>
              <p className="text-lg font-medium text-black">
                {memberSince || "—"}
              </p>
            </div>
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 max-w-2xl w-full">
              <div className="bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200">
                <p className="text-xs text-neutral-500">Name</p>
                <p className="text-lg font-medium text-neutral-800">
                  {fullName || "—"}
                </p>
              </div>

              <div className="bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200">
                <p className="text-xs text-neutral-500">Email</p>
                <p className="text-lg font-medium text-neutral-800 break-words">
                  {email || "—"}
                </p>
              </div>

              <div className="bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200">
                <p className="text-xs text-neutral-500">Phone</p>
                <p className="text-lg font-medium text-neutral-800">
                  {phone || "—"}
                </p>
              </div>

              <div className="bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200">
                <p className="text-xs text-neutral-500">Address</p>
                <p className="text-lg font-medium text-neutral-800 break-words">
                  {address || "—"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border p-3 rounded-lg"
                placeholder="Full Name"
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-3 rounded-lg"
                placeholder="Email"
              />

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border p-3 rounded-lg"
                placeholder="Phone"
              />

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border p-3 rounded-lg"
                placeholder="Address"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 text-white p-2 rounded-lg disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="flex-1 bg-gray-400 text-white p-2 rounded-lg disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
        <div className="col-span-1 order-3 md:order-0">
          <TodoList />
        </div>
        <div className="col-span-1 md:col-span-2 order-4 md:order-0">
          <UserFlashcardCarousel initialFlashcards={initialFlashcards} />
        </div>
      </div>
    </main>
  );
}
