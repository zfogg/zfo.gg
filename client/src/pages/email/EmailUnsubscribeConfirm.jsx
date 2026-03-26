import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "../../components/Header";

const EmailUnsubscribeConfirm = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | unsubscribed | error
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Removing - zfo.gg";
  }, []);

  useEffect(() => {
    const confirmUnsubscribe = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setError("No confirmation token provided");
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/email-unsubscribe-confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setError(data.error || "Failed to unsubscribe");
          return;
        }

        setStatus("unsubscribed");
        document.title = "Unsubscribed - zfo.gg";
      } catch (err) {
        setStatus("error");
        setError(err.message || "Something went wrong");
      }
    };

    void confirmUnsubscribe();
  }, [searchParams]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full">
      <Header />

      <section id="content" className="flex-1 flex justify-center items-center w-full px-4">
        <div className="max-w-2xl mx-auto w-full text-center">
          {status === "loading" && (
            <div className="text-gray-500">
              <p className="text-4xl">Removing you...</p>
            </div>
          )}

          {status === "unsubscribed" && (
            <div className="text-green-600">
              <h2 className="text-7xl font-serif mb-4">✓ You've been removed.</h2>
              <p className="text-gray-500 mb-8">You won't receive any more emails from zfo.gg.</p>
              <Link to="/" className="text-blue-500 hover:text-blue-600 underline">
                Back home
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-red-600">
              <h2 className="text-7xl font-serif mb-4">Oops</h2>
              <p className="text-3xl text-gray-500 mb-4">{error}</p>
              <p className="text-2xl text-gray-400 mb-8">
                The link may have expired. Try unsubscribing again.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/email/unsubscribe"
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  Try again
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

export default EmailUnsubscribeConfirm;
