"use client";
import { useState } from "react";
import { ResponseUser, UnverifiedEmail } from "@/types";
import { verifyEmail } from "@/db/controllers/userController";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<ResponseUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  

  const handleCreateUser = async (formData: FormData) => {
    setLoading(true);

    const response = await fetch('api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((res) => res.json())
    .catch((error) => {
      console.error("Error:", error);
      return { error: "An error occurred while logging in" };
    })
    .finally(() => setLoading(false));

    if (response.error) {
      setError(response.error);
    } else {
      setUser(response.user);
      setSuccess(true);
    }
  }
    

  return (
    <div className="flex justify-center items-center flex-col h-screen">
      <h1 className="text-3xl font-bold mb-4">Login Account</h1>
      <form 
        className="bg-gray p-6 rounded shadow-md w-96 space-y-4" 
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateUser(new FormData(e.currentTarget));
        }}
      >
        {/* <input 
          name="name"
          placeholder="Username" 
          type="text"
          required
          className="w-full px-4 py-2 border rounded"
        /> */}
        <input 
          name="email"
          placeholder="Email" 
          type="email"
          required
          className="w-full px-4 py-2 border rounded"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          name="password"
          placeholder="Password" 
          type="password"
          required
          className="w-full px-4 py-2 border rounded"
        />
        {/* <div>
          <label htmlFor="role" className="block mb-2">Role:</label>
          <select 
            name="role"
            defaultValue="viewer"
            className="w-full px-4 py-2 border rounded"
          >
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </div> */}

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded">
            User login successfully! Welcome {user?.name}
          </div>
        )}

        <button 
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50" 
          type="submit"
          disabled={loading}
        >
          {loading ? "Login..." : "Login Account"}
        </button>
        <button 
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50" 
          type="button"
          onClick={() => {
            verifyEmail(email as UnverifiedEmail)
          }}
        >
          Verify Email
        </button>
      </form>
    </div>
  );
}