import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTwitter,
  faFacebook,
  faInstagram,
  faBitcoin,
  faGithubAlt,
  faSoundcloud,
} from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';

const Footer = () => {
  const links = [
    { href: '//twitter.com/zfogg_', icon: faTwitter, external: true },
    { href: '//www.facebook.com/zach.fogg', icon: faFacebook, external: true },
    { href: '//www.instagr.am/zfogg', icon: faInstagram, external: true },
    { href: '/bitcoin', icon: faBitcoin, external: false },
    { href: '//www.github.com/zfogg', icon: faGithubAlt, external: true },
    { href: '//soundcloud.com/zfogg', icon: faSoundcloud, external: true },
  ];

  return (
    <footer id="footer" className="h-[140px] flex-shrink-0 flex justify-center gap-4 p-8">
      {links.map((link, index) => (
        link.external ? (
          <a
            key={index}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-icon transition-transform duration-[140ms] hover:-translate-y-[10px]"
          >
            <FontAwesomeIcon icon={link.icon} />
          </a>
        ) : (
          <Link
            key={index}
            to={link.href}
            className="footer-icon transition-transform duration-[140ms] hover:-translate-y-[10px]"
          >
            <FontAwesomeIcon icon={link.icon} />
          </Link>
        )
      ))}
    </footer>
  );
};

export default Footer;
