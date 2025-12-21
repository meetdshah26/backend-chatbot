import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Chat from "../models/Chat";
import User from "../models/User";

interface MessageAttributes {
  id: number;
  chatId: number;
  sender: "user" | "admin";
  message: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, "id"> {}

class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: number;
  public chatId!: number;
  public sender!: "user" | "admin";
  public message!: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "chats",
        key: "id",
      },
    },
    sender: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "messages",
    timestamps: true,
  }
);

// Associations
User.hasMany(Chat, { foreignKey: "userId", as: "chats" });
Chat.belongsTo(User, { foreignKey: "userId", as: "user" });

Chat.hasMany(Message, { foreignKey: "chatId", as: "messages" });
Message.belongsTo(Chat, { foreignKey: "chatId", as: "chat" });

// export { User, Chat, Message };
export default Message;