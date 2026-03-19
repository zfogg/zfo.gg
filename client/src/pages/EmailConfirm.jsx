import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

const EmailConfirm = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | confirmed | error
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Confirming - zfo.gg";
  }, []);

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setError("No confirmation token provided");
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/email-confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setError(data.error || "Failed to confirm email");
          return;
        }

        setStatus("confirmed");
        document.title = "Confirmed - zfo.gg";
      } catch (err) {
        setStatus("error");
        setError(err.message || "Something went wrong");
      }
    };

    void confirmEmail();
  }, [searchParams]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full">
      <header id="header" className="text-center">
        <Link to="/">
          <h1>zfogg</h1>
        </Link>
      </header>

      <section id="content" className="flex-1 flex justify-center items-center w-full px-4">
        <div className="max-w-2xl mx-auto w-full text-center">
          {status === "loading" && (
            <div className="text-gray-500">
              <p className="text-lg">Confirming your email...</p>
            </div>
          )}

          {status === "confirmed" && (
            <div className="text-green-600">
              <h2 className="text-4xl font-serif mb-4">✓ You're subscribed!</h2>
              <p className="text-gray-500 mb-8">
                You'll get an email when I write something or release software.
              </p>
              <Link to="/" className="text-blue-500 hover:text-blue-600 underline">
                Back home
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-red-600">
              <h2 className="text-4xl font-serif mb-4">Oops</h2>
              <p className="text-gray-500 mb-4">{error}</p>
              <p className="text-sm text-gray-400 mb-8">
                The link may have expired. Try signing up again.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/email" className="text-blue-500 hover:text-blue-600 underline">
                  Sign up again
                </Link>
                <Link to="/" className="text-blue-500 hover:text-blue-600 underline">
                  Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default EmailConfirm;
