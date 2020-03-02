import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity({ name: "memos" })
export class Memo {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  message_id: number;

  @Column("double")
  chat_id: number;

  @Column()
  name: string;
}
