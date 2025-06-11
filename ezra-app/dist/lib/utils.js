"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = exports.timeSince = void 0;
// Helper to format time since
const timeSince = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1)
        return Math.floor(interval) + "yr ago";
    interval = seconds / 2592000;
    if (interval > 1)
        return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1)
        return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1)
        return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1)
        return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};
exports.timeSince = timeSince;
// Utility function to combine class names
const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
};
exports.cn = cn;
