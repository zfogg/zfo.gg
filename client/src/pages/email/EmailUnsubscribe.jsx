import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const EmailUnsubscribe = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Unsubscribe - zfo.gg";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/email-unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setError(data.error || "Failed to process unsubscribe request");
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
      <div className="max-w-2xl mx-auto w-full text-center">
        <h2>Unsubscribe.</h2>
        <p className="mb-8">Enter your email to remove yourself from updates.</p>

        {status === "idle" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="midnight.hacker27@hotmail.com"
              className="px-4 py-2 border border-gray-300 rounded"
              required
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Unsubscribe
            </button>
          </form>
        )}

        {status === "loading" && <p className="text-lg text-gray-500">Processing...</p>}

        {status === "success" && (
          <div>
            <p className="text-lg text-gray-500 mb-4">Check your inbox to confirm unsubscribe.</p>
            <Link to="/" className="text-blue-500 hover:text-blue-600 underline">
              Back home
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <button
              onClick={() => setStatus("idle")}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default EmailUnsubscribe;
