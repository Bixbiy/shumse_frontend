import { Link } from "react-router-dom";

const categories = [
    "Technology",
    "Health",
    "Business",
    "Travel",
    "Education",
    "Sports",
    "Entertainment",
    "Science",
];

const siteLinks = [
    { name: "Home", to: "/" },
    { name: "About", to: "/about" },
    { name: "Contact", to: "/contact" },
    { name: "Write", to: "/editor" },
    { name: "Privacy Policy", to: "/privacy" },
    { name: "Terms of Service", to: "/terms" },
];

const Footer = () => (
    <footer className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white  pb-6 px-4 ">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-10">
            {/* Logo and Address */}
            <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-3 mb-4">
                    <img src="/logo192.png" alt="Spread Logo" className="w-10 h-10 rounded-full shadow-lg" />
                    <span className="text-2xl font-bold tracking-tight">Spread</span>
                </div>
                <p className="text-sm text-gray-200 mb-2">

                    Bahawalpur, Pakistan
                </p>
                <p className="text-sm text-gray-200 mb-2">
                    Phone: <a href="tel:+923283126920" className="hover:underline">+92 328 3126920</a>
                </p>
                <p className="text-xs text-gray-400 mt-4">&copy; {new Date().getFullYear()} Shumse. All rights reserved.</p>
            </div>

            {/* Site Links */}
            <div className="flex-1 min-w-[180px]">
                <h3 className="font-semibold text-lg mb-3">Site Links</h3>
                <ul className="space-y-2">
                    {siteLinks.map(link => (
                        <li key={link.name}>
                            <Link to={link.to} className="hover:underline text-gray-200 transition">{link.name}</Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Popular Categories */}
            <div className="flex-1 min-w-[220px]">
                <h3 className="font-semibold text-lg mb-3">Popular Categories</h3>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <Link
                            key={cat}
                            to={`/search/${encodeURIComponent(cat.toLowerCase())}`}
                            className="bg-white/10 hover:bg-white/20 text-gray-100 px-3 py-1 rounded-full text-sm font-medium transition"
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-400">
            Built with <span className="text-pink-400">♥</span> by Shumse Team &mdash; Follow us on
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="ml-1 hover:underline text-blue-300">X</a>
        </div>
    </footer>
);

export default Footer;