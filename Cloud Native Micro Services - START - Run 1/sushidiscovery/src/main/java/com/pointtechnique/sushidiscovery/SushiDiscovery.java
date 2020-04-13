package com.pointtechnique.sushidiscovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class SushiDiscovery {

	public static void main(String[] args) {
		SpringApplication.run(SushiDiscovery.class, args);
	}

}
