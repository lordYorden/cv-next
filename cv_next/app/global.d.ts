import { Database as DB } from "@/types/database.types";

declare global {
  type Database = DB;
  type CvModel = DB["public"]["Tables"]["cvs"]["Row"];
  type UserModel = DB["public"]["Tables"]["profiles"]["Row"];
  type PaginatedCvsModel = { page: number; cvs: CvModel[] };
}
