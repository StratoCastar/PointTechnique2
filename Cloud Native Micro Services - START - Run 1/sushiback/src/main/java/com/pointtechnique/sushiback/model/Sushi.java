package com.pointtechnique.sushiback.model;

import java.time.LocalDateTime;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;

import com.fasterxml.jackson.annotation.JsonIgnore;

import org.hibernate.annotations.CreationTimestamp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "SUSHIS")
public class Sushi {
    private @Id @GeneratedValue Long id;
    private String name;
    private Float price;
    @CreationTimestamp
    private LocalDateTime createdAt;
    private @Version @JsonIgnore Long version;
}