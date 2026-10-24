let ioInstance = null;

export const setIO = (io) => {
    ioInstance = io;
};

export const getIO = () => {
    return ioInstance;
};

export const userRoom = (userId) => {
    return `user:${String(userId)}`;
};

export const conversationRoom = (conversationId) => {
    return `conversation:${String(conversationId)}`;
};
