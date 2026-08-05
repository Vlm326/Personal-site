use std::collections::HashMap;
use sysinfo::System;

pub fn get_system_info() -> HashMap<String, String> {
    let mut system = sysinfo::System::new_all();
    system.refresh_all();

    let mut info = HashMap::new();
    info.insert("os_name".to_string(), System::name().unwrap_or_default());
    info.insert(
        "os_version".to_string(),
        System::os_version().unwrap_or_default(),
    );
    info.insert(
        "kernel_version".to_string(),
        System::kernel_version().unwrap_or_default(),
    );
    info.insert(
        "hostname".to_string(),
        System::host_name().unwrap_or_default(),
    );
    info.insert(
        "total_memory".to_string(),
        system.total_memory().to_string(),
    );
    info.insert("used_memory".to_string(), system.used_memory().to_string());
    info.insert("total_swap".to_string(), system.total_swap().to_string());
    info.insert("used_swap".to_string(), system.used_swap().to_string());

    info
}
