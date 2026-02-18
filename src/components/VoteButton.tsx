"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface VoteButtonProps {
  displayId: number;
  seasonId: number;
  votingOpen: boolean;
}

export default function VoteButton({ displayId, seasonId, votingOpen }: VoteButtonProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState("");

  if (!votingOpen) return null;

  const handleVote = async () => {
    if (!user || !token) {
      router.push("/login");
      return;
    }

    setVoting(true);
    setMessage("");

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ display_id: displayId, season_id: seasonId }),
      });

      const data = await res.json();
      if (res.ok) {
        setVoted(true);
        setMessage("Vote recorded!");
        router.refresh();
      } else if (res.status === 409) {
        setVoted(true);
        setMessage("You already voted for this display");
      } else {
        setMessage(data.error || "Failed to vote");
      }
    } catch {
      setMessage("Network error. Please try again.");
    }
    setVoting(false);
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleVote}
        disabled={voting || voted}
        className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all text-lg ${
          voted
            ? "bg-green-600 text-white cursor-default"
            : "bg-[#C0392B] hover:bg-[#A93226] text-white hover:shadow-xl"
        } disabled:opacity-60`}
      >
        {voting ? "Voting..." : voted ? "✓ Voted" : "❤️ Vote"}
      </button>
      {message && (
        <p className={`text-sm mt-2 ${voted ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
