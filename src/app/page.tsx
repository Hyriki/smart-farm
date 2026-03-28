"use client";
import { createUserAction } from "./actions"; // Import hàm server action
import { getUserByEmail } from "@/db/userRepo"; // Import hàm truy vấn từ repository
import { useState } from "react";
import { User } from "@/generated/prisma/client"; // Import kiểu User từ Prisma Client

export default function Home() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const handleRun = async () => {
    getUserByEmail(email)
      .then((user) => {
        setUser(user);
        if (user == null) {
          console.log("No user found with email:", email);
        }
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
      });
  }
  
  return (
    <div className="p-10">
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <button 
        className="bg-blue-500 text-white ml-2 px-4 py-2 rounded"
        onClick={handleRun}
      >
        Get user by email
      </button>
      {user && (
        <div className="mt-4 p-4 border rounded">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      )}
    </div>
  );
}