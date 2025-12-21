import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface ChatAttributes {
  id: number;
  userId: number;
  status: "active" | "closed";
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatCreationAttributes extends Optional<ChatAttributes, "id"> {}

class Chat
  extends Model<ChatAttributes, ChatCreationAttributes>
  implements ChatAttributes
{
  public id!: number;
  public userId!: number;
  public status!: "active" | "closed";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Chat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("active", "closed"),
      defaultValue: "active",
    },
  },
  {
    sequelize,
    tableName: "chats",
    timestamps: true,
  }
);
export default Chat;
