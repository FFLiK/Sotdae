import { Hono } from "hono";
import { requireManagerSession, requireSession } from "./session-middleware";
import { SessionCheckedEnv } from "./session-middleware";
import { DB_otp } from "../db/otp-repository";
import { validator } from "hono/validator";
import { DB_user } from "../db/user-repository";
import { emailValidator } from "../validators/email-validator";

const router = new Hono<SessionCheckedEnv>();

async function getUpdatedMembers(c: any, otpId: string): Promise<{ userId: string, isManager: boolean }[]> {
    const updatedMembers = await DB_otp.getMemberList(c.env.DB, otpId);
    if (!updatedMembers) {
        throw new Error("Failed to retrieve updated member list.");
    }
    const detailedMemberList = await Promise.all(updatedMembers.map(async (user) => {
        const email = await DB_user.getEmail(c.env.DB, user.userId);
        if (!email) {
            throw new Error("Some users do not have email addresses associated with their accounts.");
        }
        return {
            userId: user.userId,
            userEmail: email,
            isManager: user.isManager
        };
    }));
    return detailedMemberList;
}

router.use("*", requireSession);

router.put(
    "/:id/visibility",
    validator("json", (value, c) => {
        const visibility = value["visibility"];
        const timestamp = value["timestamp"];
        if (typeof visibility !== "boolean") {
            return c.json({error: "Invalid visibility value"}, 400);
        }
        if (typeof timestamp !== "number") {
            return c.json({error: "Invalid timestamp value"}, 400);
        }
        return {visibility: visibility, timestamp: timestamp};
    }),
    async (c) => {
        const id = c.req.param("id");
        const { visibility, timestamp } = c.req.valid("json");
        const success = await DB_otp.updateVisibility(c.env.DB, c.get("userId"), id, visibility, timestamp);
        if (!success) {
            return c.json({error: "Failed to update visibility."}, 409);
        }
        return c.json({
            message: "Visibility updated successfully",
        }, 200);
    }
)

router.put(
    "/:otpid/title",
    requireManagerSession,
    validator("json", (value, c) => {
        const title = value["title"];
        if (typeof title !== "string" || title.trim().length === 0) {
            return c.json({error: "Invalid title value"}, 400);
        }
        return {title: title.trim()};
    }),
    async (c) => {
        const id = c.req.param("otpid");
        const { title } = c.req.valid("json");
        try {
            const success = await DB_otp.updateTitle(c.env.DB, c.get("userId"), id, title);
            if (!success) {
                return c.json({error: "Failed to update title."}, 409);
            }
            return c.json({message: "Title updated successfully", value: title}, 200);
        } catch (error) {
            console.error("Error updating title:", error);
            return c.json({error: "An unexpected error occurred while updating the title."}, 500);
        }
    }
)

router.put(
    "/:otpid/service-name",
    requireManagerSession,
    validator("json", (value, c) => {
        const serviceName = value["serviceName"];
        if (typeof serviceName !== "string" || serviceName.trim().length === 0) {
            return c.json({error: "Invalid serviceName value"}, 400);
        }
        return {serviceName: serviceName.trim()};
    }),
    async (c) => {
        const id = c.req.param("otpid");
        const { serviceName } = c.req.valid("json");
        try {
            const success = await DB_otp.updateServiceName(c.env.DB, c.get("userId"), id, serviceName); 
            if (!success) {
                return c.json({error: "Failed to update serviceName."}, 409);
            }
            return c.json({message: "Service name updated successfully", value: serviceName}, 200);
        } catch (error) {
            console.error("Error updating service name:", error);
            return c.json({error: "An unexpected error occurred while updating the service name."}, 500);
        }
    }
)

router.put(
    "/:otpid/members/add",
    requireManagerSession,
    validator("json", (value, c) => {
        const emails = value["emails"];
        const role = value["role"];
        if (!Array.isArray(emails) || emails.length === 0) {
            return c.json({error: "Invalid emails value"}, 400);
        }
        if (role !== "manager" && role !== "member") {
            return c.json({error: "Invalid role value"}, 400);
        }
        for (const email of emails) {
            if (emailValidator(email)) {
                return c.json({error: `Invalid email address: ${email}`}, 400);
            }
        }
        return {emails: emails, role: role};
    }),
    async (c) => {
        const otpId = c.req.param("otpid");
        const { emails, role } = c.req.valid("json");
        try {
            const isManager = role === "manager";
            const failedEmails: string[] = [];
            const duplicateEmails: string[] = [];
            for (const email of emails) {
                const user = await DB_user.getUserByEmail(c.env.DB, email);
                if (!user) {
                    failedEmails.push(email);
                    continue;
                }
                try {
                    const relationResult = await DB_otp.createUserOtpRelation(c.env.DB, user.id, otpId, isManager, true);
                    if (!relationResult) {
                        duplicateEmails.push(email);
                    }
                } catch (error) {
                    console.error(`Error creating user-OTP relation for email ${email}:`, error);
                    failedEmails.push(email);
                }
            }
            try {
                const updatedMembers = await getUpdatedMembers(c, otpId);
                return c.json({message: "Members added successfully", failedEmails: failedEmails, duplicateEmails: duplicateEmails, members: updatedMembers}, 200);
            } catch (error) {
                if (!(error instanceof Error)) {
                    throw error;
                }
                switch (error.message) {
                    case "Failed to retrieve updated member list.":
                        return c.json({error: "Failed to retrieve updated member list."}, 500);
                    case "Some users do not have email addresses associated with their accounts.":
                        return c.json({error: "Some users do not have email addresses associated with their accounts."}, 500);
                    default:
                        console.error("Unexpected error while retrieving updated member list:", error);
                        return c.json({error: "An unexpected error occurred while retrieving the updated member list."}, 500);
                }
            }
        } catch (error) {
            console.error("Error adding members:", error);
            return c.json({error: "An unexpected error occurred while adding the members."}, 500);
        }
    }
)

router.put(
    "/:otpid/members/role",
    requireManagerSession,
    validator("json", (value, c) => {
        const memberRole = value["role"];
        if (!memberRole || typeof memberRole !== "string" || (memberRole !== "manager" && memberRole !== "member")) {
            return c.json({error: "Invalid memberRole value"}, 400);
        }
        const memberIds = value["memberIds"];
        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return c.json({error: "Invalid memberIds value"}, 400);
        }
        return {memberRole: memberRole, memberIds: memberIds};
    }),
    async (c) => {
        const otpId = c.req.param("otpid");
        const { memberRole, memberIds } = c.req.valid("json");
        try {
            const success = await DB_otp.updateMemberRole(c.env.DB, otpId, memberIds, memberRole === "manager");
            if (!success) {
                return c.json({error: "Failed to update member role."}, 409);
            }
            const updatedMembers = await DB_otp.getMemberList(c.env.DB, otpId);
            if (!updatedMembers) {
                return c.json({error: "Failed to retrieve updated member list."}, 500);
            }
            try {
                const updatedMembers = await getUpdatedMembers(c, otpId);
                return c.json({message: "Member role updated successfully", value: memberRole, members: updatedMembers}, 200);
            } catch (error) {
                if (!(error instanceof Error)) {
                    throw error;
                }
                switch (error.message) {
                    case "Failed to retrieve updated member list.":
                        return c.json({error: "Failed to retrieve updated member list."}, 500);
                    case "Some users do not have email addresses associated with their accounts.":
                        return c.json({error: "Some users do not have email addresses associated with their accounts."}, 500);
                    default:
                        console.error("Unexpected error while retrieving updated member list:", error);
                        return c.json({error: "An unexpected error occurred while retrieving the updated member list."}, 500);
                }
            }
        } catch (error) {
            console.error("Error updating member role:", error);
            return c.json({error: "An unexpected error occurred while updating the member role."}, 500);
        }
    }
)

router.delete(
    "/:otpid/members/remove",
    requireManagerSession,
    validator("json", (value, c) => {
        const memberIds = value["memberIds"];
        if (!Array.isArray(memberIds)) {
            return c.json({error: "Invalid memberIds value"}, 400);
        }
        return {memberIds: memberIds};
    }),
    async (c) => {
        const otpId = c.req.param("otpid");
        const { memberIds } = c.req.valid("json");
        try {
            const success = await DB_otp.removeMembers(c.env.DB, otpId, memberIds);
            if (!success) {
                return c.json({error: "Failed to remove members."}, 409);
            }
            try {
                const updatedMembers = await getUpdatedMembers(c, otpId);
                return c.json({message: "Members removed successfully", members: updatedMembers}, 200);
            } catch (error) {
                if (!(error instanceof Error)) {
                    throw error;
                }
                switch (error.message) {
                    case "Failed to retrieve updated member list.":
                        return c.json({error: "Failed to retrieve updated member list."}, 500);
                    case "Some users do not have email addresses associated with their accounts.":
                        return c.json({error: "Some users do not have email addresses associated with their accounts."}, 500);
                    default:
                        console.error("Unexpected error while retrieving updated member list:", error);
                        return c.json({error: "An unexpected error occurred while retrieving the updated member list."}, 500);
                }
            }
        } catch (error) {
            console.error("Error removing members:", error);
            return c.json({error: "An unexpected error occurred while removing the members."}, 500);
        }
    }
)

export default router;