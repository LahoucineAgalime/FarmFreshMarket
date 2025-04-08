package com.harvestdirect.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class HarvestDirectApplication {

    public static void main(String[] args) {
        SpringApplication.run(HarvestDirectApplication.class, args);
    }
}