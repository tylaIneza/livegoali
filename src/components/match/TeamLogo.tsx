import Image from "next/image";

function isValidImageUrl(url: string | null): url is string {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

export function TeamLogo({ logo, name, size }: { logo: string | null; name: string; size: number }) {
  if (isValidImageUrl(logo)) {
    return (
      <Image
        src={logo}
        alt={name}
        width={size}
        height={size}
        className="object-contain drop-shadow-md"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-white/8 flex items-center justify-center font-black text-primary"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {name.charAt(0) || "?"}
    </div>
  );
}
