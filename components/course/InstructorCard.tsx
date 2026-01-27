"use client";
import React from "react";
import Link from "next/link";

export default function InstructorCard({ instr }: any) {
  const instructorName = instr?.first_name || instr?.name || instr?.email || "Unknown Instructor";
  const instructorEmail = instr?.email || "";
  const instructorAvatar = instr?.profile_picture_url || instr?.avatar_url;

  return (
    <div className="col-span-1 border rounded-lg p-4">
      <div className="flex items-start gap-4">
        <img
          src={instructorAvatar || "https://ui-avatars.com/api/?name=I&background=ddd&color=555&size=64"}
          alt={instructorName}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-foreground">{instructorName}</div>
              {instr?.last_name && <div className="text-xs text-muted-foreground">{instr.last_name}</div>}
              {instructorEmail && (
                <div className="text-sm text-muted-foreground mt-1">
                  <a href={`mailto:${instructorEmail}`} className="underline">{instructorEmail}</a>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">Instructor</div>
          </div>

          <div className="text-xs text-muted-foreground mt-3">{instr?.bio || "No bio available"}</div>

          <div className="mt-3 flex gap-2">
            {instructorEmail && (
              <a href={`mailto:${instructorEmail}`} className="text-sm underline text-primary" aria-label={`Contact ${instructorName}`}>Contact</a>
            )}
            {instr?.id && (
              <Link href={`/instructors/${instr.id}`} className="text-sm underline text-muted-foreground">View profile</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
