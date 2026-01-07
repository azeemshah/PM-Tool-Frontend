import { Kanban } from "lucide-react";
import { Link } from "react-router-dom";

const Logo = (props: { url?: string }) => {
  const { url = "/" } = props;

  return (
    <Link to={url} className="flex items-center justify-center sm:justify-start">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Kanban className="size-4" />
      </div>
    </Link>
  );
};

export default Logo;
