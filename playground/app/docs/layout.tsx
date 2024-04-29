import "../../css/global.css";

export default function MdxLayout({children}: {children: React.ReactNode}) {
    // Create any shared layout or styles here
    return (
        <html>
            <body>
                <div className="text-red-500 bg-blue-500">{children}</div>;
            </body>
        </html>
    );
}
