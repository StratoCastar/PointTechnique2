package com.pointtechnique.sushiback.controller;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

import com.netflix.discovery.EurekaClient;
import com.pointtechnique.sushiback.model.Resto;

import org.springframework.hateoas.MediaTypes;
import org.springframework.hateoas.client.Traverson;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.core.TypeReferences.CollectionModelType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SushiController {

    @Autowired
    @Lazy
    private EurekaClient eurekaClient;

    @GetMapping("/restos")
    private List<Resto> getAllResto() throws URISyntaxException {

        Traverson client = new Traverson ( new URI(genereURI()),MediaTypes.HAL_JSON);

        CollectionModel<EntityModel<Resto>> restoes = client.follow("restoes")
        .toObject((new CollectionModelType<EntityModel<Resto>>(){}));

        List<Resto> restos = new ArrayList<Resto>();
        restoes.getContent().forEach(x -> restos.add(x.getContent()));

        return restos;

    }

	private String genereURI() {
        return "http://" + eurekaClient.getNextServerFromEureka("resto-back", false).getHostName() + ":" +
        eurekaClient.getNextServerFromEureka("resto-back", false).getPort();
	}

}