import { useEffect, useState } from "react";

const Email = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Get emailed - zfo.gg";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/email-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setError(data.error || "Failed to sign up");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <section id="content" className="flex-1 flex justify-center items-center w-full px-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <p className="text-3xl text-gray-700">
            I'll send you a note when I write something new or release new software.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="midnight.hacker27@hotmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading" || status === "success"}
            className="px-4 py-3 border border-gray-300 rounded text-center text-base placeholder:text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="px-6 py-3 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {status === "loading" ? "Getting emailed..." : "Get emailed"}
          </button>
        </form>

        {status === "success" && (
          <div className="text-center mt-6 text-green-600 text-sm">
            ✓ Check your inbox to confirm your email address
          </div>
        )}

        {status === "error" && (
          <div className="text-center mt-6 text-red-600 text-sm">Error: {error}</div>
        )}
      </div>
    </section>
  );
};

export default Email;
