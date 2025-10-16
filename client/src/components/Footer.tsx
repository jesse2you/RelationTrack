export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <p className="text-center text-xs text-muted-foreground">
          Brought to you by <span className="text-foreground font-medium">Jesse L.</span>{" "}
          <span className="opacity-60">• Done different 🐑</span>
        </p>
      </div>
    </footer>
  );
}
