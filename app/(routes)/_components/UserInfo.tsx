import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/user";
import UserButtonClient from "./UserButtonClient";

const UserInfo = async () => {
  const user = await getCurrentUser();

  if (!user || !user.data || !user.success) {
    redirect("/sign-in");
  }

  return (
    <div className="flex items-center gap-2">
      <UserButtonClient />
      <div className="flex flex-col">
        <p className="text-sm font-medium">{user.data.name}</p>
        <p className="text-xs text-muted-foreground">{user.data.email}</p>
      </div>
    </div>
  );
};

export default UserInfo;
