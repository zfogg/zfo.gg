import { useEffect } from "react";

const Bitcoin = () => {
  // Update page title
  useEffect(() => {
    document.title = "Bitcoin - zfo.gg";
  }, []);

  return (
    <section id="content" className="flex-1 flex justify-center items-center w-full px-4">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-light mb-4">buy me chipotle?</h3>
        <h3 className="text-2xl md:text-3xl font-light text-yellow-600 mb-6">send bitcoin!</h3>
        <p className="truncate">
          <a
            href="https://blockchain.info/address/1AoBPoUhHdnEHPQQuoc9RZ9uV7CDHbyqAK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            🔐 [my btc address] 💰
          </a>
        </p>
      </div>
    </section>
  );
};

export default Bitcoin;
