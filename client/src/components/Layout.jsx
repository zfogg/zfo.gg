import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ subtitle, children }) => {
  return (
    <div className="min-h-full flex flex-col">
      <Header subtitle={subtitle} />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
