"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "../components/ui/Navbar";
import Link from "next/link";
import Loader from "../components/ui/loader";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(user.user_metadata?.display_name || "");
        setPhone(profile.phone);
        setAddress(profile.address);
        const avatar = profile.avatar_url || user.user_metadata?.avatar_url || null;
        setAvatarUrl(avatar);
      } else {
        setFullName(user.user_metadata?.display_name || "");
        const avatar = user.user_metadata?.avatar_url || null;
        setAvatarUrl(avatar);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  async function handleSave() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Update email and display name in auth
    await supabase.auth.updateUser({
      email,
      data: {
        display_name: fullName,
      },
    });

    let uploadedUrl = avatarUrl;

    // Handle avatar removal
    if (removeAvatar) {
      const filePathPng = `${user.id}/avatar.png`;
      const filePathJpg = `${user.id}/avatar.jpg`;

      await supabase.storage.from("avatars").remove([filePathPng, filePathJpg]);

      uploadedUrl = null;
    }

    // Upload new avatar if selected
    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

      if (!allowedTypes.includes(file.type)) {
        alert("Only PNG, JPG, and JPEG images are allowed.");
        setLoading(false);
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
        setLoading(false);
        return;
      }

      const { data: signedData } = await supabase.storage
        .from("avatars")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      uploadedUrl = signedData?.signedUrl || null;
    }

    // Update or create profile row (handles case where row does not exist)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        phone,
        address,
        avatar_url: uploadedUrl,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile update failed:", profileError);
      alert("Profile update failed. Check console for details.");
      setLoading(false);
      return;
    }

    setAvatarUrl(uploadedUrl || avatarUrl || null);
    setIsEditing(false);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 flex justify-center items-center">
      <Navbar />
      <div className="grid grid-cols-3 gap-8">
        <div className="shadow-xl flex flex-col gap-4 items-center justify-center bg-linear-to-r from-purple-200 to-pink-200 via-white rounded-2xl">
          <span className="text-6xl">👋</span>
          <div className="flex flex-col gap-2 items-center justify-center">
            <h1 className="text-2xl font-light">Welcome Back, {fullName}</h1>
            <span className="font-light text-sm">Ready For the practice today</span>
          </div>
          <Link href="/mock-tests" className="text-white bg-black rounded-xl px-6 py-4 font-light leading-relaxed">Start Practicing</Link>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl w-96 space-y-4 text-center">
        <h2 className="text-2xl font-bold">My Profile</h2>

        {/* Avatar */}
        <div className="relative w-28 h-28 mx-auto">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-500"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-300 flex items-center justify-center">
              No Image
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

                    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
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

        {!isEditing ? (
          <>
            <div className="text-left space-y-2">
              <p className="text-black"><strong>Name:</strong> {fullName}</p>
              <p><strong>Email:</strong> {email}</p>
              <p><strong>Phone:</strong> {phone}</p>
              <p><strong>Address:</strong> {address}</p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-black text-white p-2 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Full Name"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Email"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Phone"
            />

            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="Address"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 text-white p-2 rounded-lg"
              >
                Save
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-400 text-white p-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </main>
  );
}