import { encryptAESGCM } from "../auth/aes-gcm";

async function seedDemoOtpData(db: D1Database, key: string) {
    
    // Add demo users
    const user1Id = crypto.randomUUID();
    const email = "demo1@fflik.kr";
    await db.prepare(
        `INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)`
    ).bind(user1Id, email, Date.now()).run();

    const user2Id = crypto.randomUUID();
    const email2 = "demo2@fflik.kr";
    await db.prepare(
        `INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)`
    ).bind(user2Id, email2, Date.now()).run();

    console.log("Demo users added successfully.");

    // Add demo OTPs
    const otp1Id = crypto.randomUUID();
    const otp1Title = "Demo OTP 1";
    const otp1ServiceName = "Demo Service 1";
    const { cipherText: otp1Key, iv: otp1Nonce } = await encryptAESGCM("3KF7UYVBQGUDKKCIDWV6HS2ABZP4JG37", key);
    await db.prepare(
        `INSERT INTO otp (id, title, service_name, otp_key, nonce, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(otp1Id, otp1Title, otp1ServiceName, otp1Key, otp1Nonce, Date.now()).run();

    const otp2Id = crypto.randomUUID();
    const otp2Title = "Demo OTP 2";
    const otp2ServiceName = "Demo Service 2";
    const { cipherText: otp2Key, iv: otp2Nonce } = await encryptAESGCM("ODVN5PYRQPSJQIHOWEY642OF4X7U6QL7", key);
    await db.prepare(
        `INSERT INTO otp (id, title, service_name, otp_key, nonce, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(otp2Id, otp2Title, otp2ServiceName, otp2Key, otp2Nonce, Date.now()).run();

    const otp3Id = crypto.randomUUID();
    const otp3Title = "Demo OTP 3";
    const otp3ServiceName = "Demo Service 3";
    const { cipherText: otp3Key, iv: otp3Nonce } = await encryptAESGCM("MQIL7DTVKBO7AYNOATPGHSDBDLCY2FIN", key);
    await db.prepare(
        `INSERT INTO otp (id, title, service_name, otp_key, nonce, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(otp3Id, otp3Title, otp3ServiceName, otp3Key, otp3Nonce, Date.now()).run();

    console.log("Demo OTPs added successfully.");

    // Add user-otp relations
    await db.prepare(
        `INSERT INTO user_otp_relation (user_id, otp_id, is_manager, visibility, appended_at) VALUES (?, ?, ?, ?, ?)`
    ).bind(user1Id, otp1Id, 1, 1, Date.now()).run();
    await db.prepare(
        `INSERT INTO user_otp_relation (user_id, otp_id, is_manager, visibility, appended_at) VALUES (?, ?, ?, ?, ?)`
    ).bind(user1Id, otp2Id, 0, 1, Date.now()).run();
    await db.prepare(
        `INSERT INTO user_otp_relation (user_id, otp_id, is_manager, visibility, appended_at) VALUES (?, ?, ?, ?, ?)`
    ).bind(user2Id, otp3Id, 1, 1, Date.now()).run();

    console.log("User-OTP relations added successfully.");
    console.log("Demo OTP data seeded successfully.");
}

export { seedDemoOtpData };