export default {
    // Bot token (string)
    token: "MTE3NjAwNTU1OTg1NDU2NzQ1NA.GQnauz.g3a_OgbUaQmOeMeR5I6MSCN_tNaOYoArGVWcls",
    guildId: "1002571149537984562", //ID ลิงค์เชิร์ฟดิสคอร์ด
    channelId: "1088869381355884585", // ID ลิงค์ห้อง Verify
    // Form for verify (array)
    requestVerify: {
        message: "กรุณากรอกข้อมูลด้านล่างนี้เพื่อยืนยันตัวตน",
        button: {
            label: "ยืนยันตัวตน",
            emoji: {
                name: "✅"
            },
        }

    },

    form: {
        title: "กรุณากรอกข้อมูลด้านล่างนี้เพื่อยืนยันตัวตน",
        input: [
            {
                name: "ชื่อ YouTube",
                placeholder: "KaynaVT",
                regex: null,
                fail: null,
            },
            {
                name: "ชื่อเล่น",
                placeholder: "Kayna",
                regex: /^.{2,20}$/,
                fail: "ชื่อเล่นต้องมีความยาว 2-20 ตัวอักษร",
            },
            {
                name: "ลิงก์ช่อง YouTube",
                placeholder: "https://www.youtube.com/channel/UCF_-M79ivR0lBcxI4VcYiWg",
                // Regex domain YouTube only
                regex: /^(https?\:\/\/)?(www\.youtube\.com)\/.+$/,
                fail: "ลิงก์ช่อง YouTube ไม่ถูกต้อง",
                youtube: true,
            }
        ]
    },
    // Role ID after verify (string) 
    roleIdAfterVerify: "1002961602590548029",
    // Channel ID for log (string)
    channelIdForLog: "1088872219259699230",

    // Remove role after verify (boolean)
    removeRoleAfterVerify: "1002985835509067817",
}